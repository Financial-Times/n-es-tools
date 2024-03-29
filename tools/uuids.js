const fs = require('fs')
const elastic = require('../lib/elastic')
const progress = require('../lib/progress')
const template = require('../lib/template')
const resolvePath = require('../lib/resolve-path')
const chalk = require('chalk')

let client
let status
let output
let options

function fetchScan () {
  return client.search({
    index: options.index,
    type: '_doc',
    q: options.query,
    sort: [ '_doc' ],
    scroll: '1m',
    size: 5000,
    _source: false
  })
    .then((response) => {
      status.total = response.body.hits.total

      response.body.hits.hits.forEach((item) => output.write(item._id + '\n'))
      // status.tick(response.body.hits.hits.length)

      return response.body._scroll_id
    })
}

function fetchScroll (scrollId) {
  return client.scroll({
    scroll: '1m',
    scrollId
  })
    .then((response) => {
      response.body.hits.hits.forEach((item) => output.write(item._id + '\n'))
      // status.tick(response.body.hits.hits.length)

      if (response.body.hits.hits.length > 0) {
        return fetchScroll(response.body._scroll_id)
      } else {
        output.end()
      }
    })
}

function run (cluster, command) {
  client = elastic(cluster)
  status = progress('Downloading UUIDs')
  options = command.opts()
  const clusterHost = global.workspace.clusters[cluster]

  // allow templating in filename to interpolate options ✌️
  const filename = template(options.filename, Object.assign({}, options, { cluster }))
  const filepath = resolvePath(filename)

  output = fs.createWriteStream(filepath)

  return Promise.resolve()
    .then(fetchScan)
    .then(fetchScroll)
    .then(() => {
      // ensure we finish writing before exiting
      return new Promise((resolve) => {
        output.on('finish', resolve)
      })
    })
    .then(() => {
      console.log(`UUIDs saved to ${filepath}`)
      process.exit()
    })
    .catch((error) => {
      console.log(chalk.red.bold.underline('Failed to write UUIDs'))
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
      console.log(chalk.red('Error: '), error)
      process.exit(1)
    })
}

module.exports = function (program) {
  program
    .command('uuids <cluster>')
    .description('Downloads all content UUIDs')
    .option('-I, --index <name>', 'The index name', 'content')
    .option('-Q, --query <querystring>', 'Simple query string query')
    .option('-F, --filename <filename>', 'Output filename', 'uuids-{{cluster}}.txt')
    .action(run)
}
