import fs from 'fs'
import path from 'path'

import moment from 'moment'
import winston from 'winston'
import { format } from 'logform'
import fclone from 'fclone'

import { getEnvironment } from '@down-the-whole/conf-loader'

import loggerConf from './logger-conf'

const {
    combine,
    timestamp,
    label,
    printf,
    align,
    colorize,
    splat,
} = format

const {
    createLogger,
    transports,
} = winston

const appDir = path.dirname(require.main.filename).replace('/src', '')
const logDir = path.join(appDir, 'logs')
const env = getEnvironment()

const logTimeFormat = 'YYYY-MM-DD HH:mm:ss.SSS'
const dateToday = moment().format('MM-DD-YYYY')
const maxFileSize = 1024 * 1024 * 100 // 100MB
const maxFiles = 20

winston.addColors(loggerConf.colors)

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

const enumerateMessageFormat = format((info) => {
    if (info.message instanceof Object || info.message instanceof Array) {
        info.message = Object.assign(
            JSON.stringify(fclone(info.message), null, 2),
            info.message,
        )
    }

    if (info.message instanceof Error) {
        info.message = Object.assign(
            `${info.message.message}\n${info.message.stack}`,
            info.message,
        )
    }

    if (info instanceof Error) {
        return {
            ...info,
            message: `${info.message}\n${info.stack}`,
        }
    }

    return info
})

export default (filename) => {
    const getLabel = () => {
        const parts = filename.split(appDir)
        return (parts && parts.length > 1) ? `.${parts[1]}` : ''
    }

    const ampLogFormat = printf((info) => {
        return `${info.timestamp} ${info.label} ${info.level}: ${info.message}`
    })

    return createLogger({
        format: format.combine(
            enumerateMessageFormat(),
            colorize(),
            label({
                label: getLabel(),
            }),
            timestamp({
                format: logTimeFormat,
            }),
            ampLogFormat,
        ),
        transports: [
            new transports.Console({
                level: env === 'development' ? 'debug' : 'info',
                json: false,
                prettyPrint: true,
                showLevel: true,
            }),
            new transports.File({
                name: 'base',
                level: env === 'development' ? 'debug' : 'info',
                filename: `${logDir}/log-info-${dateToday}.log`,
                maxsize: maxFileSize,
                maxFiles: maxFiles,
                json: false,
                prettyPrint: true,
                tailable: true,
            }),
            new transports.File({
                name: 'error',
                level: 'error',
                filename: `${logDir}/log-error-${dateToday}.log`,
                maxsize: maxFileSize,
                maxFiles: maxFiles,
                json: false,
                prettyPrint: true,
                tailable: true,
            }),
        ],
        exceptionHandlers: [
            new transports.Console({
                json: false,
                prettyPrint: true,
            }),
            new transports.File({
                name: 'exception',
                filename: `${logDir}/log-exception-${dateToday}.log`,
                maxsize: maxFileSize,
                json: false,
                showLevel: true,
                prettyPrint: true,
                tailable: true,
            }),
        ],
        exitOnError: false,
        levels: loggerConf.levels,
    })
}
