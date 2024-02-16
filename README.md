> [!WARNING]<br />
> This package is deprecated as of **2024-02-16**. We haven't had need to create a snapshot for our Elasticsearch cluster for years, and we recommend using the [API](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshots-take-snapshot.html#manually-create-snapshot) Elasticsearch provides directly in the future.

# Next Elasticsearch Tools [![CircleCI](https://circleci.com/gh/Financial-Times/n-es-tools.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-es-tools)

A useful CLI for working with Next's Elasticsearch clusters. Includes tools to snapshot and restore indexes.

## Prerequisites

- Node version defined by `engines.node` in `package.json`. Run command `nvm use` to switch your local Node version to the one specified in `.nvmrc`.
- [Vault CLI](https://github.com/Financial-Times/vault/wiki/Getting-Started#login-with-the-cli) (optional, see notes below)

## Installation and setup

You can install the tool from NPM by running the following command:

```
$ npm i -g @financial-times/n-es-tools
```

This will create a new folder in your home directory containing a single `config.yml` file. The tool requires several configuration settings which _must to be added to this file_ in order to use it.

**Note:** By default the tool assumes that you have the [Vault CLI](https://github.com/Financial-Times/vault/wiki/Getting-Started#login-with-the-cli) installed and are logged in. It will attempt to download and apply the required configuration settings automatically. This may be skipped using the `--skip-config` flag when running install manually.

## Usage

You can view the available commands and options by running:

```
$ n-es-tools --help
```

### Snapshotting and restoring an index

```sh
# set up a snapshot repository for the source cluster
$ n-es-tools repository eu -N transfers
> Repository "transfers" created (using the bucket "next-elasticsearch-eu-west-1-backups") for eu cluster

# set up a snapshot repository on the target cluster using the same S3 bucket
$ n-es-tools repository us -N transfers -B next-elasticsearch-eu-west-1-backups
> Repository "transfers" created (using the bucket "next-elasticsearch-eu-west-1-backups") for us cluster

# create a snapshot of the source index
$ n-es-tools snapshot eu -R transfers
> Snapshot "my-snapshot" created for "content_2017-12-04" index from eu cluster

# restore index to the target cluster (use actual name, not an alias)
$ n-es-tools restore us -R transfers -I content_2017-12-04
> Restored "my-snapshot" snapshot of "content_2017-12-04" index to us cluster
```

### Finding synchronisation problems

For issues caused by content published within the last 24 hours:

```sh
$ n-es-tools sync
```

For any issues caused by content published further back in time:

```sh
# fetch all UUIDs from each index
$ n-es-tools uuids eu
$ n-es-tools uuids us

# find differences between them and advise what to do
$ n-es-tools diff uuids-eu.txt uuids-us.txt
```

## Development

Here's the policy attached to the `next-es-tools` user that this tool authenticates as.

### AWS IAM User

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFormationStackCreation",
            "Effect": "Allow",
            "Action": [
                "cloudformation:Create*",
                "cloudformation:Describe*",
                "cloudformation:EstimateTemplateCost",
                "cloudformation:ListStacks",
                "cloudformation:ValidateTemplate"
            ],
            "Resource": "*"
        },
        {
            "Sid": "AllowCloudFormationStackDeletion",
            "Effect": "Allow",
            "Action": [
                "cloudformation:DeleteStack"
            ],
            "Resource": [
                "arn:aws:cloudformation:::stack/next-content-*"
            ]
        },
        {
            "Sid": "AllowCloudFormationStackManagement",
            "Effect": "Allow",
            "Action": [
                "cloudformation:CancelUpdateStack",
                "cloudformation:ContinueUpdateRollback",
                "cloudformation:CreateChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:Get*",
                "cloudformation:List*",
                "cloudformation:PreviewStackUpdate",
                "cloudformation:SetStackPolicy",
                "cloudformation:SignalResource",
                "cloudformation:UpdateStack"
            ],
            "Resource": [
                "arn:aws:cloudformation:::stack/next-content-*",
                "arn:aws:cloudformation:::stack/nextcontent",
                "arn:aws:cloudformation:::stack/nextelasticdev"
            ]
        },
        {
            "Sid": "AllowNextContentElasticsearchDomainCreation",
            "Effect": "Allow",
            "Action": [
                "es:CreateElasticsearchDomain",
                "es:Describe*",
                "es:List*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "AllowNextContentElasticsearchDomainDeletion",
            "Effect": "Allow",
            "Action": [
                "es:DeleteElasticsearchDomain"
            ],
            "Resource": [
                "arn:aws:es:::domain/next-content-*",
                "arn:aws:es:::domain/nextcontent",
                "arn:aws:es:::domain/nextelasticdev"
            ]
        },
        {
            "Sid": "AllowNextContentElasticsearchDomainManagement",
            "Effect": "Allow",
            "Action": [
                "es:AddTags",
                "es:RemoveTags",
                "es:UpdateElasticsearchDomainConfig"
            ],
            "Resource": [
                "arn:aws:es:::domain/next-content-*",
                "arn:aws:es:::domain/nextcontent",
                "arn:aws:es:::domain/nextelasticdev"
            ]
        },
        {
            "Sid": "AllowPassRoleForRepositoryCreation",
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::027104099916:role/FTApplicationRoleFor_nextcontent"
        },
        {
            "Sid": "AllowKeyRotation",
            "Effect": "Allow",
            "Action": [
                "iam:CreateAccessKey",
                "iam:DeleteAccessKey",
                "iam:ListAccessKeys",
                "iam:UpdateAccessKey"
            ],
            "Resource": "arn:aws:iam:::user/${aws:username}"
        }
    ]
}
```

### Fixing authorisation issues

Rotating AWS keys means that eventually the `access_key` stored at `~/.n-es-tools/config.yml` will become outdated, meaning that you will see something like the following message:

```
<TASK> failed: Authorization Exception :: {"path":"/content/item/_search","query":{"sort":"_doc","scroll":"1m","size":5000,"_source":"false"},"statusCode":403,"response":"{\"message\":\"The security token included in the request is invalid.\"}"}
```

Reinstalling `n-es-tools` will pull in the current `access_key` and should address this issue.
## Operations
These are some, but not all, of the commands available in `n-es-tools`.

### create-index

Create a new index within a cluster. This command requires a schema file called `index-schema.json` to be present within the .n-es-tools directory in your home directory. i.e. ~/.n-es-tools/index-schema.json.

If you are using this command to reindex ElasticSearch then you can use the contents of [next-es-interface/schema/content.json](https://github.com/Financial-Times/next-es-interface/blob/main/schema/content.json).
##### `n-es-tools create-index <cluster>`

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster in which to to create new index (dev, eu, or us) </td>
  </tr>
  <tr>
    <th align="right">Options</th>
    <td><code>--index</code>, <code>-I</code></td>
    <td>The name of the new index to be created</td>
  </tr>
</table>

### delete-index

Delete an index from a given cluster
##### `n-es-tools delete-index <cluster>`

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster in which to delete the index (dev, eu, or us) </td>
  </tr>
  <tr>
    <th align="right">Options</th>
    <td><code>--index</code>, <code>-I</code></td>
    <td>The name of the new index to be deleted</td>
  </tr>
</table>

### diff
##### `n-es-tools diff <a> <b>`

Returns the differences between two sets of uuids

<table>
  <tr>
    <th align="right" rowspan="2">Arguments</th>
    <td><code>a</code></td>
    <td>filename for first list of uuids</td>
  </tr>
  <tr>
    <td><code>b</code></td>
    <td>filename for second list of uuids </td>
  </tr>
  <tr>
    <th align="right">Options</th>
    <td colspan="2"><em>none</em></td>
  </tr>
</table>

### get-aliases

##### `n-es-tools get-aliases <cluster>`

Returns the list of aliases on a cluster and the indexes that they're assigned to

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster from which to retrieve aliases (dev, eu, or us) </td>
  </tr>
  <tr>
    <th align="right">Options</th>
    <td colspan="2"><em>none</em></td>
  </tr>
</table>

### list-indices

Retrieve the list of indices on a cluster
##### `n-es-tools list-indices <cluster>`

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster from which to retrieve indices (dev, eu, or us) </td>
  </tr>
  <tr>
    <th align="right">Options</th>
    <td colspan="2"><em>none</em></td>
  </tr>
</table>

### reindex
##### `n-es-tools reindex <cluster>`

Copies content from one index to another

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster in which to perform the reindex (dev, eu, or us) </td>
  <tr>
    <th align="right" rowspan="2">Options</th>
    <td><code>--source</code>, <code>-S</code></td>
    <td>The source index, where content will be copied from</td>
  </tr>
  <tr>
    <td><code>--dest</code>, <code>-D</code></td>
    <td>The destination index, where content will be copied to</td>
  </tr>
</table>

### reassign-alias

Reassign an alias from one index to another.

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster in which to perform the reindex (dev, eu, or us) </td>
  <tr>
    <th align="right" rowspan="3">Options</th>
    <td><code>--aliasName</code>, <code>-A</code></td>
    <td>The name of the alias to be reassigned</td>
  </tr>
  <tr>
    <td><code>--source</code>, <code>-S</code></td>
    <td>The source index, where the alias will be removed from</td>
  </tr>
  <tr>
    <td><code>--dest</code>, <code>-D</code></td>
    <td>The destination index, where the alias will be added to</td>
  </tr>
</table>

### uuids
##### `n-es-tools uuids <cluster>`

Outputs all uuids in a given index to a .txt file

<table>
  <tr>
    <th align="right">Arguments</th>
    <td><code>cluster</code></td>
    <td>cluster in which to perform the reindex (dev, eu, or us) </td>
  <tr>
    <th align="right" rowspan="3">Options</th>
    <td><code>--index</code>, <code>-I</code></td>
    <td>The name of the index to retrieve uuids for</td>
  </tr>
  <tr>
    <td><code>--query</code>, <code>-Q</code></td>
    <td>Simple query string query (optional)</td>
  </tr>
  <tr>
    <td><code>--filename</code>, <code>-F</code></td>
    <td>Filename to output list of uuids to (optional; defaults to <code>uuids-{{cluster}}.txt)</code></td>
  </tr>
</table>

