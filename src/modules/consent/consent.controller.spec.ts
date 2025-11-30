import { Test, TestingModule } from '@nestjs/testing';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';

describe('ConsentController', () => {
  let controller: ConsentController;
  let service: jest.Mocked<ConsentService>;

  const mockConsent = {
    _id: '507f1f77bcf86cd799439011',
    scope: 'test-value',
    expiresAt: 'test-value',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentController],
      providers: [
        {
          provide: ConsentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ConsentController>(ConsentController);
    service = module.get(ConsentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a consent', async () => {
      const createDto = {
        scope: 'test-value',
        expiresAt: 'test-value',
      };

      service.create.mockResolvedValue(mockConsent as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockConsent);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated consents', async () => {
      const mockResult = {
        items: [mockConsent],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      service.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a consent by id', async () => {
      service.findOne.mockResolvedValue(mockConsent as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockConsent);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a consent', async () => {
      const updateDto = {};

      const updatedMock = { ...mockConsent, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a consent', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
