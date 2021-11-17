const chalk = require('chalk')
const progress = require('../lib/progress')
const elastic = require('../lib/elastic')
const wait = require('../lib/wait')

let client
let status

function verifyIndices ({ source, dest }) {
  return client.cat.indices({
    format: 'json'
  })
    .then((result) => {
      const a = result.body.some(({ index }) => index === source)
      const b = result.body.some(({ index }) => index === dest)

      if (a === false) {
        throw Error(`Could not find the index "${source}"`)
      }

      if (b === false) {
        throw Error(`Could not find the index "${dest}"`)
      }
    })
}

function startReindex ({ source, dest }) {
  return client.reindex({
    body: {
      source: {
        index: source
      },
      dest: {
        index: dest
      }
    },
    waitForCompletion: false
  })
}

function pingStatus (taskId) {
  return client.tasks.get({ taskId })
    .then((result) => {
      const resBody = result.body
      status.total = resBody.task.status.total
      status.curr = resBody.task.status.updated

      // Don't draw a progress bar before we have any data
      // and don't draw one when AWS gets carried away.
      if (status.total > 0 && status.curr <= status.total) {
        status.tick(0)
      }

      if (resBody.completed) {
        if (resBody.response.failures.length) {
          const causes = resBody.response.failures.map((failure) => failure.cause)

          return Promise.reject(
            new Error(`Task completed but with failures... ${JSON.stringify(causes)}`)
          )
        } else {
          return resBody.response
        }
      }

      return wait(10000).then(() => pingStatus(taskId))
    })
}

function run (cluster, command) {
  const opts = command.opts()

  client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(chalk.cyan.bold.underline('You are reindexing from source index:'))
  console.log(opts.source)
  console.log(chalk.cyan.bold.underline('to destination index:'))
  console.log(opts.dest)

  console.log(chalk.cyan.bold.underline('From the cluster'))
  console.log(`${cluster}: ${clusterHost}`)

  status = progress('Reindexing')

  return Promise.resolve()
    .then(() => verifyIndices(opts))
    .then(() => startReindex(opts))
    .then(({ body }) => {
      console.log(`Reindex started with task ID ${body.task}`)
      return pingStatus(body.task)
    })
    .then(() => {
      console.log(`Reindex from ${opts.source} to ${opts.dest} complete`)
      process.exit()
    })
    .catch((error) => {
      console.log(chalk.red.bold.underline('Failed to reindex'))
      console.log(`${chalk.red('From Index:')} ${opts.source}`)
      console.log(`${chalk.red('To Index:')} ${opts.dest}`)
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
      console.log(chalk.red('Error: '), error)
      process.exit(1)
    })
}

module.exports = function (program) {
  program
    .command('reindex <cluster>')
    .description('Copies content from one index to another')
    .option('-S, --source <name>', 'The source index name', 'content')
    .option('-D, --dest <name>', 'The destination index name')
    .action(run)
}
