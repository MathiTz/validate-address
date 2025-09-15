import fastify from 'fastify';
import cors from '@fastify/cors';
import { validateAddress } from './addressValidator';
import { AddressRequest, ErrorResponse, ServiceInfo, AddressValidationResult } from './types';

const app = fastify({ logger: true });

const requestSchema = {
  type: 'object',
  required: ['address'],
  properties: {
    address: {
      type: 'string',
      minLength: 1,
      maxLength: 500
    }
  }
} as const;

const responseSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['valid', 'corrected', 'unverifiable']
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1
    },
    original: {
      type: 'string'
    },
    validated: {
      type: ['object', 'null'],
      properties: {
        streetNumber: { type: ['string', 'null'] },
        streetName: { type: ['string', 'null'] },
        city: { type: ['string', 'null'] },
        state: { type: ['string', 'null'] },
        zipCode: { type: ['string', 'null'] },
        formatted: { type: 'string' }
      }
    },
    corrections: {
      type: 'array',
      items: { type: 'string' }
    }
  }
} as const;

app.register(cors, {
  origin: true
});

app.get('/', async (): Promise<ServiceInfo> => {
  return {
    service: 'Address Validation API',
    version: '1.0.0',
    endpoints: {
      'POST /validate-address': 'Validate and standardize a US address'
    }
  };
});

app.post<{
  Body: AddressRequest;
  Reply: AddressValidationResult | ErrorResponse;
}>('/validate-address', {
  schema: {
    body: requestSchema,
    response: {
      200: responseSchema,
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { address } = request.body;

    if (!address || typeof address !== 'string') {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Address field is required and must be a string'
      });
    }

    const result = validateAddress(address.trim());
    return result;

  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while processing the address'
    });
  }
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: error.message
    });
  }

  return reply.code(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

const start = async (): Promise<void> => {
  try {
    const port = parseInt(process.env.PORT || '3333', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { app, start };
