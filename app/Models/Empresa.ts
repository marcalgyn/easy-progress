import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Empresa extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public cnpj: string

  @column()
  public razaoSocial: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

}
