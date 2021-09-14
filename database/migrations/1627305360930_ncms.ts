import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Ncms extends BaseSchema {
  protected tableName = 'ncms'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.bigInteger('codigo').unique().notNullable()
      table.float('aliquota')
      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
