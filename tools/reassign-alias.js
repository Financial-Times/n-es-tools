const elastic = require('../lib/elastic')

function createErrorMessage (value) {
  console.log(`You have not provided a value for ${value}. Please provide a value for ${value} with the --${value} option before continuing`)
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

  console.log(`Reassigning alias ${alias} from ${oldIndex} to ${newIndex} in ${cluster}: ${clusterHost}`)

  const actions = {
    'actions': [
      { 'remove': { 'index': `${oldIndex}`, 'alias': `${alias}` } },
      { 'add': { 'index': `${newIndex}`, 'alias': `${alias}` } }
    ]
  }

  client.indices.updateAliases({ body: { actions } })
    .then(() => {
      console.log(`Successfully reassigned alias ${alias} from ${oldIndex} to ${newIndex} in ${cluster}: ${clusterHost}`)
    })
    .catch(error => {
      console.log(`Failed to reassign alias ${alias} from ${oldIndex} to ${newIndex} in ${cluster}: ${clusterHost}`)
      console.log('error: ', error.meta.statusCode, error.meta.body.Message)
    })
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
