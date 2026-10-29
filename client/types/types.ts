interface ITag {
  _id: string;
  name: string;
}

interface IUser {
  _id: string;
  name: string;
  bio: string;
  email: string;
  photo: string;
  createdAt: string;
  github: string;
  linkedin: string;
  publicEmail: string;
  role: string;
  twoFactorEnabled?: boolean;
}

interface ISnippet {
  _id: string;
  title: string;
  code: string;
  description: string;
  language: string;
  tags: ITag[];
  likedBy: string[];
  user: IUser;
  createdAt: string;
  forkedFrom?: { _id: string; title: string } | null;
  forkCount?: number;
  isPublic?: boolean;
}

export type { ISnippet, IUser, ITag };
