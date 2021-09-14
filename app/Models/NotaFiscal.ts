import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import ItensNotaFiscal from './ItensNotaFiscal'

export default class NotaFiscal extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public nf: string

  @column()
  public modelo: number

  @column()
  public serie: number

  @column()
  public dataEmissao: Date

  @column()
  public cnpjEmitente: string

  @column()
  public nomeEmitente: string

  @column()
  public cnpjDestinatario: string

  @column()
  public nomeCliente: string

  @column()
  public valorTotal: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @hasMany(() => ItensNotaFiscal)
  public itens: HasMany<typeof ItensNotaFiscal>

}
