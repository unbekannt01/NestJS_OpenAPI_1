import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAColumn1746784257645 implements MigrationInterface {
    name = 'AddAColumn1746784257645'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_1" ADD "A" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_1" DROP COLUMN "A"`);
    }

}
