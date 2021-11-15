const elastic = require('../lib/elastic')

function run (cluster, command) {
  const client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]
  const options = command.opts()
  const indexName = options.index

  console.log(`Deleting index ${indexName} from ${cluster}: ${clusterHost}`)

  client.indices.delete({
    format: 'json',
    index: indexName
  })
    .then(() => {
      console.log(`Index ${indexName} has been deleted from ${cluster}: ${clusterHost}`)
    })
    .catch(error => {
      console.log(`Failed to delete ${indexName} from ${cluster}: ${clusterHost}`)
      console.log(error.message)
    })
}

module.exports = function (program) {
  program
    .command('delete-index <cluster>')
    .description('delete a given index within a cluster - clusters options include dev,eu,us')
    .option('-I, --index <name>', 'The index name')
    .action(run)
}
