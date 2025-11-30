import { Test, TestingModule } from '@nestjs/testing';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';

describe('HospitalController', () => {
  let controller: HospitalController;
  let service: jest.Mocked<HospitalService>;

  const mockHospital = {
    _id: '507f1f77bcf86cd799439011',
    name: 'test-name',
    state: 'test-state',
    district: 'test-district',
    hospitalType: 'test-value',
    isActive: true,
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
      controllers: [HospitalController],
      providers: [
        {
          provide: HospitalService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<HospitalController>(HospitalController);
    service = module.get(HospitalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a hospital', async () => {
      const createDto = {
        name: 'test-name',
        state: 'test-state',
        district: 'test-district',
      };

      service.create.mockResolvedValue(mockHospital as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockHospital);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated hospitals', async () => {
      const mockResult = {
        items: [mockHospital],
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
    it('should return a hospital by id', async () => {
      service.findOne.mockResolvedValue(mockHospital as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockHospital);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a hospital', async () => {
      const updateDto = {};

      const updatedMock = { ...mockHospital, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a hospital', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
