const chalk = require('chalk')
const elastic = require('../lib/elastic')

function createErrorMessage (value) {
  return `You have not provided a value for ${value}. Please provide a value for ${value} with the --${value} option before continuing`
}

function run (cluster, command) {
  const { alias, oldIndex, newIndex } = command.opts()

  if (!alias) {
    throw new Error(createErrorMessage('alias'))
  }
  if (!oldIndex) {
    throw new Error(createErrorMessage('oldIndex'))
  }
  if (!newIndex) {
    throw new Error(createErrorMessage('newIndex'))
  }

  const client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(chalk.cyan.bold.underline('Reassigning alias'))
  console.log(`${chalk.cyan('Alias:')} ${alias}`)
  console.log(`${chalk.cyan('From Index:')} ${oldIndex}`)
  console.log(`${chalk.cyan('To Index:')} ${newIndex}`)
  console.log(`${chalk.cyan('Cluster:')} ${cluster}: ${clusterHost}`)

  const actions = {
    'actions': [
      { 'remove': { 'index': `${oldIndex}`, 'alias': `${alias}` } },
      { 'add': { 'index': `${newIndex}`, 'alias': `${alias}` } }
    ]
  }

  return client.indices.updateAliases({ body: { actions } })
    .then(() => {
      console.log(chalk.green.bold.underline('Alias reassigned'))
      console.log(`${chalk.green('Alias:')} ${alias}`)
      console.log(`${chalk.green('From Index:')} ${oldIndex}`)
      console.log(`${chalk.green('To Index:')} ${newIndex}`)
      console.log(`${chalk.green('Cluster:')} ${cluster}: ${clusterHost}`)
    })
    .catch(error => {
      console.log(chalk.red.bold.underline('Failed to reassign alias'))

      console.log(`${chalk.red('Alias:')} ${alias}`)
      console.log(`${chalk.red('From Index:')} ${oldIndex}`)
      console.log(`${chalk.red('To Index:')} ${newIndex}`)
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)

      console.log(chalk.red('Error:'), error.meta.statusCode, error.meta.body.Message)
    })
}

module.exports = function (program) {
  program
    .command('reassign-alias <cluster>')
    .description('reassigns an alias from one index to another')
    .option('-A, --alias', 'name of the alias to reassign')
    .option('-O, --oldIndex <name>', 'The old index name')
    .option('-N, --newIndex <name>', 'The new index name')
    .action(run)
}
