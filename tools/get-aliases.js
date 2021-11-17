const chalk = require('chalk')
const elastic = require('../lib/elastic')

let client

function fetchAliases () {
  return client.cat.aliases({
    format: 'json'
  })
}

async function run (cluster, command) {
  client = elastic(cluster)
  const clusterHost = global.workspace.clusters[cluster]

  return fetchAliases()
    .then(response => {
      const output = response.body.map(item => {
        return {
          indexName: item.index,
          alias: item.alias
        }
      })

      console.log(chalk.green.bold.underline('Aliases'))
      console.log(output)
    })
    .catch(error => {
      console.log(chalk.red.bold.underline('Failed to get aliases'))
      console.log(`${chalk.red('Cluster:')} ${cluster}: ${clusterHost}`)
      console.log(error)
      process.exit(1)
    })
}

module.exports = function (program) {
  program
    .command('get-aliases <cluster>')
    .description('gets alias names on a given cluster')
    .action(run)
}
