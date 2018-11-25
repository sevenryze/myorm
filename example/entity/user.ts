import { Column, Entity } from "../../src/";
import { BaseInfo, IBaseInfoOptions } from "./base-info";

export interface IUserOptions extends IBaseInfoOptions {
  name: string;
  age: number;
}

@Entity({})
export class User extends BaseInfo {
  @Column({})
  public name: string;

  @Column({})
  public age: number;

  get bigAge() {
    return this.age + 1;
  }

  constructor(options: IUserOptions) {
    super(options);

    const { age, name } = options;
    this.name = name;
    this.age = age;
  }
}
