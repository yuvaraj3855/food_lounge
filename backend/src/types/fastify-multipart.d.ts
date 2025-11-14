import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    file(): Promise<{
      toBuffer(): Promise<Buffer>;
      filename: string;
      mimetype: string;
      encoding: string;
      fieldname: string;
    } | undefined>;
  }
}

