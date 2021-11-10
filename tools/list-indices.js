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

  console.log(`Listing all indices in ${clusterHost}`)

  try {
    const elasticsearchResponse = await fetchIndices()
    const output = elasticsearchResponse.body.map(item => {
      return {
        indexName: item.index,
        documentCount: item['docs.count']
      }
    })

    console.log(output)
  } catch (error) {
    console.log(`Failed to get indices for ${clusterHost}`)
    console.log(error.message)
  }
}

module.exports = function (program) {
  program
    .command('list-indices <cluster>')
    .description('List all of the indices within the cluster - clusters options include dev,eu,us')
    .action(run)
}
