const elastic = require('../lib/elastic')

let client

function fetchAliases () {
  return client.cat.aliases({
    format: 'json'
  })
}

async function run (cluster, command) {
  client = elastic(cluster)

  try {
    const aliases = await fetchAliases()
    console.log('aliases', aliases)
  } catch (error) {
    console.error(`get-alias failed: ${error}`)
    process.exit(1)
  }
}

module.exports = function (program) {
  program
    .command('get-aliases <cluster>')
    .description('gets alias names on a given cluster')
    .action(run)
}
