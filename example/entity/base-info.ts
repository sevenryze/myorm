import { Column, Entity } from "../../src";

export interface IBaseInfoOptions {
  id?: string;
  creationTime?: Date;
}

@Entity({})
export abstract class BaseInfo {
  @Column({})
  public id: Buffer;
  get idString() {
    return this.id.toString();
  }

  @Column({})
  public creationTime: Date;

  constructor(options: IBaseInfoOptions) {
    const { creationTime = new Date(), id = "sdf" } = options;

    this.id = (id as unknown) as Buffer;
    this.creationTime = creationTime;
  }
}
