const chalk = require('chalk')
const elastic = require('../lib/elastic')

function run (cluster, command) {
  const { index } = command.opts()

  if (!index) {
    return console.log('You have not provided a value for "index". Please provide a value for "index" with the --index option before continuing')
  }

  const client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(chalk.cyan.bold.underline('You are deleting the index'))
  console.log(index)

  console.log(chalk.cyan.bold.underline('From the cluster'))
  console.log(`${cluster}: ${clusterHost}`)

  client.indices.delete({
    format: 'json',
    index: index
  })
    .then(() => {
      console.log(chalk.green.bold.underline('Index deleted'))
      console.log(`${chalk.green('Index:')} ${index}`)
      console.log(`${chalk.green('Deleted from:')} ${cluster}: ${clusterHost}`)
    })
    .catch(error => {
      console.log(chalk.red.bold.underline('Failed to delete index'))
      console.log(`${chalk.red('Index:')} ${index}`)
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
      console.log(chalk.red('Error: '), error)
      process.exit(1)
    })
}

module.exports = function (program) {
  program
    .command('delete-index <cluster>')
    .description('delete a given index within a cluster - clusters options include dev,eu,us')
    .option('-I, --index <name>', 'The index name')
    .action(run)
}
