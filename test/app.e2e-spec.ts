import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto';

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

    describe('Edit Me', () => {
      it('should fail with invalid jwt', () => {
        return pactum.spec().patch('/users').expectStatus(401);
      });

      it('should edit user correctly', () => {
        const dto: EditUserDto = {
          firstName: 'Essa',
          lastName: 'Bessa',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });

  describe('Bookmarks', () => {
    const dto: CreateBookmarkDto = {
      title: 'Google',
      link: 'https://google.com',
    };

    it('should get empty bookmarks', () => {
      return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectBody([]);
    });

    it('Create Bookmark', () => {
      return pactum
        .spec()
        .post('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .withBody(dto)
        .expectStatus(201)
        .stores('bookmarkId', 'id');
    });

    it('Get All Bookmarks (should get 1)', () => {
      return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(1);
    });

    it('Get Bookmark by ID', () => {
      return pactum
        .spec()
        .get('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectBodyContains('$S{bookmarkId}');
    });

    it('Edit Bookmark', () => {
      const editDto: CreateBookmarkDto = {
        title: 'Essa',
        link: 'https://bessa.com',
        description: 'Essa Bessa',
      };

      return pactum
        .spec()
        .patch('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .withBody(editDto)
        .expectStatus(200)
        .expectBodyContains(editDto.title)
        .expectBodyContains(editDto.link);
    });

    it('Delete Bookmark', () => {
      return pactum
        .spec()
        .delete('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(204);
    });

    it('should get empty bookmarks', () => {
      return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(0);
    });
  });
});
