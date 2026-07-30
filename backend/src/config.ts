import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'siakad-dev-secret',
  jwtExpiresIn: '1d',
};
