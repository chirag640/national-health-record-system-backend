import { Test, TestingModule } from '@nestjs/testing';
import { EncounterController } from './encounter.controller';
import { EncounterService } from './encounter.service';

describe('EncounterController', () => {
  let controller: EncounterController;
  let service: jest.Mocked<EncounterService>;

  const mockEncounter = {
    _id: '507f1f77bcf86cd799439011',
    visitReason: 'test-visitReason',
    diagnosis: 'test-diagnosis',
    prescriptions: 'test-value',
    vitals: 'test-value',
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
      controllers: [EncounterController],
      providers: [
        {
          provide: EncounterService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EncounterController>(EncounterController);
    service = module.get(EncounterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a encounter', async () => {
      const createDto = {
        visitReason: 'test-visitReason',
        diagnosis: 'test-diagnosis',
        prescriptions: 'test-value',
        vitals: 'test-value',
      };

      service.create.mockResolvedValue(mockEncounter as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockEncounter);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated encounters', async () => {
      const mockResult = {
        items: [mockEncounter],
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
    it('should return a encounter by id', async () => {
      service.findOne.mockResolvedValue(mockEncounter as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockEncounter);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a encounter', async () => {
      const updateDto = {};

      const updatedMock = { ...mockEncounter, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a encounter', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
