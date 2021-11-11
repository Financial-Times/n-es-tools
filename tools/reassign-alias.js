const elastic = require('../lib/elastic')

function displayErrorMessage (value) {
  console.log(`You have not provided a value for ${value}. Please provide a value for ${value} with the --${value} option before continuing`)
}

function run (cluster, command) {
  const { alias, oldIndex, newIndex } = command.opts()

  if (!alias) {
    displayErrorMessage('alias')
  }
  if (!oldIndex) {
    displayErrorMessage('oldIndex')
  }
  if (!newIndex) {
    displayErrorMessage('newIndex')
  }

  const client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  console.log(`Reassigning alias ${alias} from ${oldIndex} to ${newIndex} in ${cluster}: ${clusterHost}`)

  const actions = {
    'actions': [
      { 'remove': { 'index': `${oldIndex}`, 'alias': `${alias}` } },
      { 'add': { 'index': `${newIndex}`, 'alias': `${alias}` } }
    ]
  }

  return client.indices.updateAliases({ body: { actions } })
}

module.exports = function (program) {
  program
    .command('assign-alias <cluster>')
    .description('reassigns an alias from one index to another')
    .option('-A, --alias', 'name of the alias to reassign')
    .option('-O, --oldIndex <name>', 'The old index name')
    .option('-N, --newIndex <name>', 'The new index name')
    .action(run)
}
