export type UnsplashPhoto = {
  id: string;
  blur_hash: string | null;
  color: string | null;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isUnsplashPhoto(value: unknown): value is UnsplashPhoto {
  if (!isRecord(value) || !isRecord(value.urls) || !isRecord(value.links)) {
    return false;
  }

  if (!isRecord(value.user) || !isRecord(value.user.links)) {
    return false;
  }

  return (
    isString(value.id) &&
    isNullableString(value.blur_hash) &&
    isNullableString(value.color) &&
    isNullableString(value.description) &&
    isNullableString(value.alt_description) &&
    isString(value.urls.raw) &&
    isString(value.urls.full) &&
    isString(value.urls.regular) &&
    isString(value.urls.small) &&
    isString(value.links.html) &&
    isString(value.links.download_location) &&
    isString(value.user.name) &&
    isString(value.user.username) &&
    isString(value.user.links.html)
  );
}
