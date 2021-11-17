const chalk = require('chalk')
const elastic = require('../lib/elastic')

function createErrorMessage (value) {
  return `You have not provided a value for ${value}. Please provide a value for ${value} with the --${value} option before continuing`
}

function run (cluster, command) {
  const { aliasName, source, dest } = command.opts()

  if (!aliasName) {
    throw new Error(createErrorMessage('alias'))
  }
  if (!source) {
    throw new Error(createErrorMessage('source'))
  }
  if (!dest) {
    throw new Error(createErrorMessage('dest'))
  }

  const client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(chalk.cyan.bold.underline('Reassigning alias'))
  console.log(`${chalk.cyan('Alias:')} ${aliasName}`)
  console.log(`${chalk.cyan('From Index:')} ${source}`)
  console.log(`${chalk.cyan('To Index:')} ${dest}`)
  console.log(`${chalk.cyan('Cluster:')} ${cluster}: ${clusterHost}`)

  const actions = {
    'actions': [
      { 'remove': { 'index': `${source}`, 'alias': `${aliasName}` } },
      { 'add': { 'index': `${dest}`, 'alias': `${aliasName}` } }
    ]
  }

  return client.indices.updateAliases({ body: actions })
    .then(() => {
      console.log(chalk.green.bold.underline('Alias reassigned'))
      console.log(`${chalk.green('Alias:')} ${aliasName}`)
      console.log(`${chalk.green('From Index:')} ${source}`)
      console.log(`${chalk.green('To Index:')} ${dest}`)
      console.log(`${chalk.green('Cluster:')} ${cluster}: ${clusterHost}`)
    })
    .catch(error => {
      console.log(chalk.red.bold.underline('Failed to reassign alias'))
      console.log(`${chalk.red('Alias:')} ${aliasName}`)
      console.log(`${chalk.red('From Index:')} ${source}`)
      console.log(`${chalk.red('To Index:')} ${dest}`)
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
      console.log(chalk.red('Error: '), error)
      process.exit(1)
    })
}

module.exports = function (program) {
  program
    .command('reassign-alias <cluster>')
    .description('reassigns an alias from one index to another')
    .option('-A, --aliasName <name>', 'name of the alias to reassign')
    .option('-S, --source <name>', 'The old index name')
    .option('-D, --dest <name>', 'The new index name')
    .action(run)
}
