import { Test, type TestingModule } from "@nestjs/testing"
import { AuthService } from "./auth.service"
import { JwtService } from "@nestjs/jwt"
import { getRepositoryToken } from "@nestjs/typeorm"
import { User, UserRole, UserStatus } from "../user/entities/user.entity"
import { Otp } from "../otp/entities/otp.entity"
import { EmailVerification } from "../email-verification-by-link/entity/email-verify.entity"
import type { Repository } from "typeorm"
import { ConfigService } from "@nestjs/config"
import { OtpService } from "../otp/otp.service"
import { EmailServiceForOTP } from "../otp/services/email.service"
import { EmailServiceForVerifyMail } from "../email-verification-by-link/services/email-verify.service"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { FileStorageService } from "../common/services/file-storage.service"
import { UnauthorizedException, NotFoundException, ConflictException } from "@nestjs/common"
import * as bcrypt from "bcrypt"
import { jest } from "@jest/globals" // Import jest to declare it

describe("AuthService", () => {
  let service: AuthService
  let userRepository: Repository<User>
  let otpRepository: Repository<Otp>
  let jwtService: JwtService

  const mockUser: Partial<User> = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    password: "$2b$10$hashedpassword",
    first_name: "John",
    last_name: "Doe",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    is_logged_in: false,
    loginAttempts: 0,
    isBlocked: false,
  }

  const mockUserRepository: any = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  }

  const mockOtpRepository: any = {
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  }

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockOtpService = {
    generateOtp: jest.fn(),
    getOtpExpiration: jest.fn(),
  }

  const mockEmailServiceForOTP = {
    sendOtpEmail: jest.fn(),
  }

  const mockEmailServiceForVerification = {
    sendVerificationEmail: jest.fn(),
  }

  const mockEventEmitter = {
    emit: jest.fn(),
  }

  const mockFileStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository as unknown as Partial<Repository<User>>,
        },
        {
          provide: getRepositoryToken(Otp),
          useValue: mockOtpRepository as unknown as Partial<Repository<Otp>>,
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useValue: { save: jest.fn(), delete: jest.fn(), create: jest.fn() } as unknown as Partial<Repository<EmailVerification>>,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: EmailServiceForOTP,
          useValue: mockEmailServiceForOTP,
        },
        {
          provide: EmailServiceForVerifyMail,
          useValue: mockEmailServiceForVerification,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: FileStorageService,
          useValue: mockFileStorageService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    otpRepository = module.get<Repository<Otp>>(getRepositoryToken(Otp))
    jwtService = module.get<JwtService>(JwtService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("loginUser", () => {
    it("should successfully login a user with valid credentials", async () => {
      // Arrange
      const identifier = "test@example.com"
      const password = "password123"
      const hashedPassword = await bcrypt.hash(password, 10)

      const user = { ...mockUser, password: hashedPassword } as User

      mockUserRepository.findOne.mockResolvedValue(user)
      mockJwtService.sign.mockReturnValue("mock-jwt-token")
      mockConfigService.get.mockReturnValue("mock-secret")

      // Act
      const result = await service.loginUser(identifier, password)

      // Assert
      expect(result).toHaveProperty("access_token")
      expect(result).toHaveProperty("refresh_token")
      expect(result.message).toBe("USER Login Successfully!")
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_logged_in: true,
          loginAttempts: 0,
        }),
      )
    })

    it("should throw NotFoundException for non-existent user", async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(service.loginUser("nonexistent@example.com", "password")).rejects.toThrow(NotFoundException)
    })

    it("should increment login attempts on wrong password", async () => {
      // Arrange
      const user = { ...mockUser, loginAttempts: 2 } as User
      mockUserRepository.findOne.mockResolvedValue(user)

      // Act & Assert
      await expect(service.loginUser("test@example.com", "wrongpassword")).rejects.toThrow(UnauthorizedException)

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          loginAttempts: 3,
        }),
      )
    })

    it("should block user after 10 failed attempts", async () => {
      // Arrange
      const user = { ...mockUser, loginAttempts: 9 } as User
      mockUserRepository.findOne.mockResolvedValue(user)

      // Act & Assert
      await expect(service.loginUser("test@example.com", "wrongpassword")).rejects.toThrow(UnauthorizedException)

      expect(mockUserRepository.update).toHaveBeenCalledWith(user.id, { isBlocked: true })
    })
  })

  describe("registerUsingOTP", () => {
    const createUserDto = {
      email: "newuser@example.com",
      password: "password123",
      first_name: "New",
      last_name: "User",
      userName: "newuser",
      mobile_no: "+1234567890",
      birth_date: new Date("1990-01-01"),
    }

    it("should successfully register a new user", async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null)
      mockUserRepository.create.mockReturnValue(mockUser)
      mockUserRepository.save.mockResolvedValue(mockUser)
      mockOtpService.generateOtp.mockReturnValue("123456")
      mockOtpService.getOtpExpiration.mockReturnValue(new Date())
      mockOtpRepository.save.mockResolvedValue({})

      // Act
      const mockFile = undefined as unknown as Express.Multer.File
      const result = await service.registerUsingOTP(createUserDto, mockFile)

      // Assert
      expect(result.message).toContain("registered successfully")
      expect(mockUserRepository.create).toHaveBeenCalled()
      expect(mockOtpRepository.save).toHaveBeenCalled()
      expect(mockEmailServiceForOTP.sendOtpEmail).toHaveBeenCalled()
    })

    it("should throw ConflictException for existing active user", async () => {
      // Arrange
      const existingUser = { ...mockUser, status: UserStatus.ACTIVE } as User
      mockUserRepository.findOne.mockResolvedValue(existingUser)
      // Act & Assert
      const mockFile = undefined as unknown as Express.Multer.File
      await expect(service.registerUsingOTP(createUserDto, mockFile)).rejects.toThrow(ConflictException)
    })

    it("should handle username conflicts", async () => {
      // Arrange
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: "different-id", userName: "newuser" }) // username check

      // Act & Assert
    })
  })

  describe("logout", () => {
    it("should successfully logout a logged-in user", async () => {
      // Arrange
      const user = { ...mockUser, is_logged_in: true } as User
      mockUserRepository.findOne.mockResolvedValue(user)
      mockUserRepository.save.mockResolvedValue(user)

      // Act
      const result = await service.logout(user.id)

      // Assert
      expect(result.message).toBe("User logout successful.")
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_logged_in: false,
          refresh_token: null,
          expiryDate_token: null,
          jti: null,
        }),
      )
    })

    it("should throw NotFoundException for non-existent user", async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(service.logout("non-existent-id")).rejects.toThrow(NotFoundException)
    })

    it("should throw UnauthorizedException for already logged out user", async () => {
      // Arrange
      const user = { ...mockUser, is_logged_in: false } as User
      mockUserRepository.findOne.mockResolvedValue(user)

      // Act & Assert
      await expect(service.logout(user.id)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe("generateUserToken", () => {
    it("should generate valid JWT tokens", async () => {
      // Arrange
      const userId = "123e4567-e89b-12d3-a456-426614174000"
      const role = UserRole.USER

      mockConfigService.get.mockReturnValue("test-secret")
      mockJwtService.sign.mockReturnValue("mock-jwt-token")
      mockUserRepository.update.mockResolvedValue({ affected: 1 })

      // Act
      const result = await service.generateUserToken(userId, role)

      // Assert
      expect(result).toHaveProperty("access_token")
      expect(result).toHaveProperty("refresh_token")
      expect(result).toHaveProperty("expires_in")
      expect(result.expires_in).toBe(3600)
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          role: role,
          jti: expect.any(String),
        }),
        expect.any(Object),
      )
    })

    it("should throw error when JWT_SECRET is not defined", async () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined)

      // Act & Assert
      await expect(service.generateUserToken("user-id", UserRole.USER)).rejects.toThrow(
        "JWT_SECRET is not defined in environment variables",
      )
    })
  })
})
