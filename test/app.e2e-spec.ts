import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';

describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3000);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto = {
      email: 'essa@bessa.com',
      password: '12345678',
    };

    describe('Sign Up', () => {
      it('should fail with empty email and throw error', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            email: '',
          })
          .expectStatus(400);
      });
      it('should fail with empty password and throw error', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            password: '',
          })
          .expectStatus(400);
      });
      it('should create a new user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
        // .inspect();
      });
    });

    describe('Login', () => {
      it('should fail with empty email and throw error', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            ...dto,
            email: '',
          })
          .expectStatus(400);
      });
      it('should fail with empty password and throw error', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            ...dto,
            password: '',
          })
          .expectStatus(400);
      });
      it('should login and provide jwt', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get Me', () => {
      it('should fail with invalid jwt', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('should return current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit Me', () => {});
  });

  describe('Bookmark', () => {
    describe('Get All Bookmarks', () => {});

    describe('Create Bookmark', () => {});

    describe('Get Bookmark by ID', () => {});

    describe('Edit Bookmark', () => {});

    describe('Delete Bookmark', () => {});
  });
});
