/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Alerts, LatestAlerts } from "./alerts";
import { ForecastType, DailyForecast, HourlyForecast } from "./forecast";
import { LatestObservation, Observation } from "./observation";
import { Gridpoint, Points } from "./points";
import { Station, Stations } from "./stations";

export class WeatherReport {
    private _point?: Gridpoint;
    private _station?: Station;
    private _current?: Observation;
    private _forecast?: ForecastType[keyof ForecastType];
    private _alerts?: Alerts;

    public static async create(
        latitude: number,
        longitude: number,
        forecast: keyof ForecastType = "daily"
    ): Promise<WeatherReport> {
        const instance = new WeatherReport(latitude, longitude, forecast);
        await instance.refresh();
        return instance;
    }

    private constructor(
        private readonly latitude: number,
        private readonly longitude: number,
        private readonly forecastType: keyof ForecastType
    ) {}

    public get point() {
        return this._point;
    }

    public get station() {
        return this._station;
    }

    public get current() {
        return this._current;
    }

    public get forecast() {
        return this._forecast;
    }

    public get alerts() {
        return this._alerts;
    }

    public async refresh(): Promise<void> {
        const alertsPromise = new LatestAlerts(
            this.latitude,
            this.longitude
        ).get();

        this._point = await new Points(this.latitude, this.longitude).get();

        const stationsPromise = new Stations(this._point).get();
        const forecastPromise =
            this.forecastType === "daily"
                ? new DailyForecast(this._point).get()
                : new HourlyForecast(this._point).get();

        const stations = await stationsPromise;
        const [station] = stations.features;
        if (station) {
            this._station = station;
            this._current = await new LatestObservation(
                station.properties.stationIdentifier
            ).get();
        }
        this._forecast = await forecastPromise;
        this._alerts = await alertsPromise;
    }
}
