import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ItensNotaFiscals extends BaseSchema {
  protected tableName = 'itens_nota_fiscals'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('nota_fiscal_id')
        .unsigned()
        .references('nota_fiscals.id')
      table.string('nf').notNullable()
      table.string('descricao').notNullable()
      table.integer('cfop').notNullable()
      table.bigInteger('ncm').notNullable()
      table.integer('cst')
      table.float('percentual')
      table.float('quantidade')
      table.decimal('valor_unitario', 12, 2)
      table.decimal('valor_bruto', 12, 2)
      table.float('ipi')
      table.decimal('valor_desconto', 12, 2)
      table.decimal('despesas_acessorias', 12, 2)
      table.decimal('valor_icms', 12, 2)
      table.float('aliquota_icms')
      table.decimal('sub_total', 12, 2)
      table.decimal('valor_imposto', 12, 2)
      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
