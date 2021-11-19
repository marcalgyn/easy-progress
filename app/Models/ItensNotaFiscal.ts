import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import NotaFiscal from './NotaFiscal'

export default class ItensNotaFiscal extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public notaFiscalId: number

  @column()
  public nf: string

  @column()
  public descricao: string

  @column()
  public cfop: number

  @column()
  public ncm: number

  @column()
  public cst: number

  @column()
  public percentual: number

  @column()
  public quantidade: number

  @column()
  public valorUnitario: number

  @column()
  public valorBruto: number

  @column()
  public ipi: number

  @column()
  public valorDesconto: number

  @column()
  public despesasAcessorias: number

  @column()
  public valorIcms: number

  @column()
  public aliquotaIcms: number

  @column()
  public valorFrete: number

  @column()
  public subTotal: number

  @column()
  public valorImposto: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => NotaFiscal)
  public notaFiscal: BelongsTo<typeof NotaFiscal>
}
