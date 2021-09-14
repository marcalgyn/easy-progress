import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Ncm extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public codigo: number

  @column()
  public aliquota: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

}
