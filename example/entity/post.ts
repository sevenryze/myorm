import { Column, Entity } from "../../src/";
import { BaseInfo, IBaseInfoOptions } from "./base-info";

export interface IPostOptions extends IBaseInfoOptions {
  title: string;
  content: string;
  authorId: string;
}

@Entity({})
export class Post extends BaseInfo {
  @Column({})
  public title: string;

  @Column({})
  public content: string;

  @Column({})
  public authorId: Buffer;
  get authorIdString() {
    return this.authorId.toString();
  }

  public toSqlString() {
    return {};
  }

  constructor(options: IPostOptions) {
    super(options);

    const { content, title, authorId } = options;
    this.title = title;
    this.content = content;
    this.authorId = (authorId as unknown) as Buffer;
  }
}
