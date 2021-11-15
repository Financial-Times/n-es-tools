const os = require('os')
const path = require('path')
const fileSystem = require('fs')
const elastic = require('../lib/elastic')

function loadIndexSchema () {
  const schemaPath = path.join(os.homedir(), '.n-es-tools', 'index-schema.json')
  return fileSystem.readFileSync(schemaPath, 'utf8')
}

let client

function createIndex (indexName, indexSchema) {
  return client.indices.create({
    index: indexName,
    body: indexSchema
  })
}

async function run (cluster, command) {
  const clusterHost = global.workspace.clusters[cluster]
  const options = command.opts()
  const indexName = options.index
  let indexSchema
  client = elastic(cluster)

  if (!indexName) {
    throw new Error('The --index option is required')
  }

  console.log(`You are about to create a new index in ${clusterHost}`)

  console.log(`The new index will be called ${options.index}`)

  try {
    indexSchema = loadIndexSchema()
  } catch (error) {
    console.log('Failed to load index schema', error.message)
  }

  try {
    await createIndex(indexName, indexSchema)

    console.log('New index created')
    console.log(`Created in: ${clusterHost}`)
    console.log(`New index called: ${indexName}`)
  } catch (error) {
    console.log('Failed to create index', error.meta.statusCode, error.meta.body.Message)
  }
}

module.exports = function (program) {
  program
    .command('create-index <cluster>')
    .description('Creates a new index within the cluster - clusters options include dev,eu,us')
    .option('-I, --index <name>', 'The index name you want to create')
    .action(run)
}
