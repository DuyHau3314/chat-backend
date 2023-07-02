export class Helpers {
  static firstLetterUppercase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static lowerCase(str: string): string {
    return str.toLowerCase();
  }

  static generateRandomIntegers(integerLength: number): number {
    const characters = '0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < integerLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return parseInt(result, 10);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parseJson(prop: string): any {
    try {
      JSON.parse(prop);
    } catch (error) {
      return prop;
    }
    return JSON.parse(prop);
  }
}
