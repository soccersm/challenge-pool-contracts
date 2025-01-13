# Steps for Deployment

## Deploy Soccersm Diamond

1. Deploy DiamondCutFacet.
2. Deploy Soccersm Diamond
3. Deploy Diamond Init
4. Deploy OwnershipFacet
5. Deploy DiamonLoupeFacet
6. Deploy AccessControlFacet

## Deploy Soccersm Modules as Facets

1. Deploy TopicRegistry Init
2. Deploy TopicRegistry
3. Deploy ChallengePool Init
4. Deploy ChallengePool
5. Deploy ChallengePoolManager

## Deploy Data Providers

Deploy all data providers in `./contract/modules/data-providers`

## Deploy Pool Resolvers

Deploy all pool resolvers in `./contract/modules/pool-resolvers`

## Set Accetped Tokens

Before any pool creation can happen, accepted tokens must be specified. Since ChallengePoolManager is already deployed, this can be setup.

## Create Pool Topics

Before any pool creation can happen, the supported pool topics need to be created using the topic registry `createTopic`.

## Other Deployments

1. AirdropPaymaster
