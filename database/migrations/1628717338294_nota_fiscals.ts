import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class NotaFiscals extends BaseSchema {
  protected tableName = 'nota_fiscals'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('nf').notNullable()
      table.integer('modelo').notNullable()
      table.integer('serie').notNullable()
      table.date('data_emissao').notNullable()
      table.string('cnpj_emitente', 20).notNullable()
      table.string('nome_emitente', 180).notNullable()
      table.string('cnpj_destinatario', 20).notNullable()
      table.string('nome_cliente', 120).notNullable()
      table.decimal('valor_total', 12, 2).notNullable()
      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
