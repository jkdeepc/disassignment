import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as custom from 'aws-cdk-lib/custom-resources'
import { generateBatch } from '../shared/util';
import { Table } from '../seed/Table';

export class DsAssignment1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Table',{
      partitionKey: {name:"Id", type:dynamodb.AttributeType.STRING },
      sortKey:{name:"name", type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName:'Toy',
    });

    const postFn = new lambdanode.NodejsFunction(this, 'PostFunction', {
      runtime:lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/post.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize:128,
      environment:{
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1'
      }
    })

    const getItemsFn = new lambdanode.NodejsFunction(this, 'GetItemsFunction', {
      runtime:lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/getItems.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize:128,
      environment:{
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1'
      }
    })

    const getItemFn = new lambdanode.NodejsFunction(this, 'GetItemFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/getItem.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1',
      },
    });

    const updateFn = new lambdanode.NodejsFunction(this, 'UpdateItemFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/update.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1',
      },
    });

    const translateFn = new lambdanode.NodejsFunction(this, 'TranslateFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: `${__dirname}/../lambdas/translation.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: 'eu-west-1',
      },
    });

    table.grantWriteData(postFn);
    table.grantReadData(getItemsFn);
    table.grantReadData(getItemFn);
    table.grantWriteData(updateFn);
    table.grantReadWriteData(translateFn);

    translateFn.addToRolePolicy( 
      new cdk.aws_iam.PolicyStatement({ 
        actions: ['translate:TranslateText'], 
        resources: ['*'], 
      })
    );

    const api = new apig.RestApi(this, 'Api', {
      restApiName: "Service",
      description: 'This is Api',
      deployOptions:{
        stageName:"dev",
      },
      defaultCorsPreflightOptions:{
        allowHeaders: ["Content-Type"],
        allowMethods: ["OPTONS","GET", "PUT", "PATCH", "DELETE","POST"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
      apiKeySourceType: apig.ApiKeySourceType.HEADER,
    })

    const toys = api.root.addResource('toys');

    toys.addMethod('POST', new apig.LambdaIntegration(postFn));

    toys.addMethod('GET', new apig.LambdaIntegration(getItemsFn))

    const ItemById = toys.addResource('{Id}');
    ItemById.addMethod('GET', new apig.LambdaIntegration(getItemFn), );

    toys.addMethod('PUT',new apig.LambdaIntegration(updateFn));

    const translation =ItemById
    .addResource('{name}')
    .addResource('translation');

  translation.addMethod('GET', new apig.LambdaIntegration(translateFn));
    new custom.AwsCustomResource(this, 'SeedMoviesData', {
      onCreate: {

        service: 'DynamoDB', 
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [table.tableName]: generateBatch(Table), 
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of('SeedData'), 
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [table.tableArn],
      }),
    });
  }
}
