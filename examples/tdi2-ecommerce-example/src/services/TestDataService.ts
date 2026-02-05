import { Service } from '@tdi2/di-core/decorators';

export interface TestDataServiceInterface {
  generateRandomShippingInfo(): {
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };

  generateRandomPaymentInfo(): {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  };
}

@Service()
export class TestDataService implements TestDataServiceInterface {
  private readonly testNames = [
    'John Doe',
    'Jane Smith',
    'Bob Johnson',
    'Alice Williams',
    'Charlie Brown',
    'Diana Prince',
  ];

  private readonly testAddresses = [
    '123 Main St',
    '456 Oak Ave',
    '789 Pine Rd',
    '321 Elm Blvd',
    '555 Maple Dr',
    '999 Cedar Ln',
  ];

  private readonly testCities = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
  ];

  private readonly testZips = [
    '10001',
    '90001',
    '60601',
    '77001',
    '85001',
    '19101',
  ];

  private readonly testCountries = [
    'USA',
    'United States',
    'US',
  ];

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  generateRandomShippingInfo() {
    return {
      fullName: this.getRandomElement(this.testNames),
      address: this.getRandomElement(this.testAddresses),
      city: this.getRandomElement(this.testCities),
      zipCode: this.getRandomElement(this.testZips),
      country: this.getRandomElement(this.testCountries),
    };
  }

  generateRandomPaymentInfo() {
    const fullName = this.getRandomElement(this.testNames);

    // Generate random test credit card (Visa format: 4xxx xxxx xxxx xxxx)
    const randomCard = `4${Math.floor(Math.random() * 1000000000000000)
      .toString()
      .padStart(15, '0')}`;

    // Random expiry date (2025-2029)
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomYear = Math.floor(Math.random() * 5) + 25; // 25-29 for 2025-2029

    // Random CVV (100-999)
    const randomCvv = Math.floor(Math.random() * 900 + 100);

    return {
      cardNumber: randomCard,
      cardHolder: fullName,
      expiryDate: `${randomMonth.toString().padStart(2, '0')}/${randomYear}`,
      cvv: randomCvv.toString(),
    };
  }
}
