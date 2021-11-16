const chalk = require('chalk')
const elastic = require('../lib/elastic')

function run (cluster, command) {
  const { indexName } = command.opts()

  if (!indexName) {
    console.log(`You have not provided a value for 'index'. Please provide a value for 'index' with the --index option before continuing`)
  }

  const client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(chalk.cyan.bold.underline('You are deleting the index'))
  console.log(indexName)

  console.log(chalk.cyan.bold.underline('From the cluster'))
  console.log(`${cluster}: ${clusterHost}`)

  client.indices.delete({
    format: 'json',
    index: indexName
  })
    .then(() => {
      console.log(chalk.green.bold.underline('Index deleted'))
      console.log(`${chalk.green('Index:')} ${indexName}`)
      console.log(`${chalk.green('Deleted from:')} ${cluster}: ${clusterHost}`)
    })
    .catch(error => {
      console.log(chalk.red.bold.underline('Failed to delete index'))
      console.log(`${chalk.red('Index:')} ${indexName}`)
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)

      console.log(chalk.red('Error: '), error.meta.statusCode, error.meta.body.Message)
    })
}

module.exports = function (program) {
  program
    .command('delete-index <cluster>')
    .description('delete a given index within a cluster - clusters options include dev,eu,us')
    .option('-I, --index <name>', 'The index name')
    .action(run)
}
