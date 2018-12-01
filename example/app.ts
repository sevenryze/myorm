import { getTransactionQueryRunner, prepareRepository } from "../src";
import { Post } from "./entity/post";
import { User } from "./entity/user";
import { PostRepository } from "./repository/post";
import { UserRepository } from "./repository/user";

async function app() {
  const userRepo = await prepareRepository(UserRepository);
  await userRepo.save(new User({ name: "faf", age: 12 }));

  const postRepo = await prepareRepository(PostRepository);
  await postRepo.save(
    new Post({
      authorId: "12",
      content: "sdfsdf",
      title: "sfdsf",
    })
  );

  const transactionQueryRunner = await getTransactionQueryRunner();
  await transactionQueryRunner.startTransaction();
  const userRepoTrans = await prepareRepository(UserRepository, transactionQueryRunner);
  userRepoTrans.save({} as any);

  const postRepoTrans = await prepareRepository(PostRepository, transactionQueryRunner);
  postRepoTrans.save({} as any);
  await transactionQueryRunner.commitTransaction();
  await transactionQueryRunner.rollbackTransaction();
}
