const os = require('os')
const path = require('path')
const fileSystem = require('fs')
const chalk = require('chalk')
const elastic = require('../lib/elastic')

function loadIndexSchema () {
  const schemaPath = path.join(os.homedir(), '.n-es-tools', 'index-schema.json')
  return fileSystem.readFileSync(schemaPath, 'utf8')
}

let client

function createIndex (indexName, indexSchema) {
  return client.indices.create({
    index: indexName,
    body: indexSchema
  })
}

async function run (cluster, command) {
  const clusterHost = global.workspace.clusters[cluster]
  const options = command.opts()
  const indexName = options.index
  let indexSchema
  client = elastic(cluster)

  if (!indexName) {
    throw new Error('The --index option is required')
  }

  console.log(chalk.cyan.bold.underline('You are creating a new index in'))
  console.log(clusterHost)

  console.log(chalk.cyan.bold.underline('The new index will be named'))
  console.log(options.index)

  try {
    indexSchema = loadIndexSchema()
  } catch (error) {
    console.log(chalk.red.bold.underline('Failed to load index schema'), error.message)
    process.exit(1)
  }

  try {
    await createIndex(indexName, indexSchema)

    console.log(chalk.green.bold.underline('New index created'))
    console.log(`${chalk.green('Created in:')} ${clusterHost}`)
    console.log(`${chalk.green('New index called:')} ${indexName}`)
  } catch (error) {
    console.log(chalk.red.bold.underline('Failed to create index'))
    console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
    console.log(chalk.red('Error: '), console.dir(error, { depth: 10 }))
    process.exit(1)
  }
}

module.exports = function (program) {
  program
    .command('create-index <cluster>')
    .description('Creates a new index within the cluster - clusters options include dev,eu,us')
    .option('-I, --index <name>', 'The index name you want to create')
    .action(run)
}
