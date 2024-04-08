export function CheckENV(ENVs: any): string[] {
  const errors: string[] = [];

  if (isNotString(ENVs?.DB_HOST)) {
    errors.push('DB_HOST');
  }

  if (isNotString(ENVs?.DB_USER)) {
    errors.push('DB_USER');
  }

  if (isNotString(ENVs?.DB_PASSWORD)) {
    errors.push('DB_PASSWORD');
  }

  if (isNotString(ENVs?.REDIS_HOST)) {
    errors.push('REDIS_HOST');
  }

  if (isNotString(ENVs?.REDIS_PASSWORD)) {
    errors.push('REDIS_PASSWORD');
  }

  if (isNotString(ENVs?.SECRET_WORD)) {
    errors.push('SECRET_WORD');
  }

  if (isNotString(ENVs?.EXPIRES_IN)) {
    errors.push('EXPIRES_IN');
  }

  if (isNaNInt(ENVs?.PORT)) {
    errors.push('PORT');
  }

  if (isNotString(ENVs?.TELEGRAM_TOKEN)) {
    errors.push('TELEGRAM_TOKEN');
  }

  if (isNotString(ENVs?.WEB_APP_URL)) {
    errors.push('WEB_APP_URL');
  }

  return errors;
}

function isNotString(value: string): boolean {
  return value.toString().length === 0;
}

function isNaNInt(value: string): boolean {
  return Number.isNaN(Number.parseInt(value));
}

function isNaNFloat(value: string): boolean {
  return Number.isNaN(Number.parseFloat(value));
}
