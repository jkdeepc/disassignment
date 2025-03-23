import { Toy, CreateInput } from './type';
import { DynamoDB } from 'aws-sdk';


export function createItem(input: CreateInput): Toy {
  return {
    Id: input.Id,
    name: input.name,
    description: input.description,
    likeIt: input.likeIt ?? false, 
    rating: input.rating ?? undefined,
    translations: { en: input.description },
  };
}


export function generateBatch(items: Toy[]): DynamoDB.Types.WriteRequests {
  return items.map((b) => {
    const item = convertToDynamoFormat(b);
    return {
      PutRequest: { Item: item },
    };
  });
}

function convertToDynamoFormat(item: Toy): DynamoDB.AttributeMap {
  return DynamoDB.Converter.marshall(item);
}