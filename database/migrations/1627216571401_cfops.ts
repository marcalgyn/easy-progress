import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Cfops extends BaseSchema {
  protected tableName = 'cfops'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('codigo').unique().notNullable()
      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
