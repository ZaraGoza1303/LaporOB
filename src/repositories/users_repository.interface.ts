export interface IUsersRepository {
    getAll()
    getByID()
    insert()
    update()
    delete(userId: string): Promise<void>;
}