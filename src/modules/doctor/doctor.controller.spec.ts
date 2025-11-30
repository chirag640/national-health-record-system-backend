import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

describe('DoctorController', () => {
  let controller: DoctorController;
  let service: jest.Mocked<DoctorService>;

  const mockDoctor = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'test-fullName',
    phone: 'test-phone',
    specialization: 'test-specialization',
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
      controllers: [DoctorController],
      providers: [
        {
          provide: DoctorService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
    service = module.get(DoctorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a doctor', async () => {
      const createDto = {
        fullName: 'test-fullName',
        phone: 'test-phone',
        specialization: 'test-specialization',
      };

      service.create.mockResolvedValue(mockDoctor as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockDoctor);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated doctors', async () => {
      const mockResult = {
        items: [mockDoctor],
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
    it('should return a doctor by id', async () => {
      service.findOne.mockResolvedValue(mockDoctor as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockDoctor);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a doctor', async () => {
      const updateDto = {};

      const updatedMock = { ...mockDoctor, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a doctor', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
