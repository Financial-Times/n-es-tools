const chalk = require('chalk')
const elastic = require('../lib/elastic')

let client

function fetchIndices () {
  return client.cat.indices({
    format: 'json'
  })
}

async function run (cluster) {
  client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(chalk.cyan.bold.underline('Listing all indices in'))
  console.log(clusterHost)

  try {
    const elasticsearchResponse = await fetchIndices()
    const output = elasticsearchResponse.body.map(item => {
      return {
        indexName: item.index,
        documentCount: item['docs.count']
      }
    })

    console.log(chalk.green.bold.underline('Indices'))
    console.log(output)
  } catch (error) {
    console.log(chalk.red.bold.underline('Failed to get indices'))
    console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
    console.log(chalk.red('Error: '), error)
    process.exit(1)
  }
}

module.exports = function (program) {
  program
    .command('list-indices <cluster>')
    .description('List all of the indices within the cluster - clusters options include dev,eu,us')
    .action(run)
}
