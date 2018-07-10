from flask import (
    Flask,
    render_template,
    request,
    url_for,
    redirect,
    jsonify,
    send_file)
import pandas as pd
import pandas_gbq
import json
import csv
from jinja2 import Template
from google.cloud import bigquery
from google.oauth2 import service_account
from pyspark.sql import SparkSession
client = bigquery.Client()

#grab the data from Google Big Query based on zipcode
credentials = service_account.Credentials.from_service_account_file('solar-project-204922-c03989dc6491.json')
project_id = 'solar-project-204922'
client = bigquery.Client(credentials=credentials,project=project_id)


#################################################
# Flask Setup
#################################################
app = Flask(__name__)

# create routes
@app.route('/')
def home():
    """Return the dashboard homepage."""
    return render_template("canvas.html")

@app.route('/zip_bounds/<zipcode>')
def zip_data(zipcode):

    query = (
        'SELECT * '
        'FROM [solar-project-204922:solarData.tx_zip_bounds] '
        'WHERE properties_ZCTA5CE10 = {} '
        'LIMIT 1000').format(zipcode)

    # Set use_legacy_sql to True to use legacy SQL syntax.
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = True

    query_job = client.query(query,
        location='US',
        job_config=job_config)

    boundsJSON = {}

    for row in query_job:
        #print(row)
        boundsJSON['properties_ZCTA5CE10'] = row.properties_ZCTA5CE10
        boundsJSON['geometry_coordinates'] = row.geometry_coordinates


    return (jsonify(boundsJSON))

@app.route('/solar_data')
def solar_data_all():

    query = (
        'SELECT lat_avg, lng_avg, kw_total '
        'FROM [bigquery-public-data:sunroof_solar.solar_potential_by_postal_code] '
        'WHERE state_name = "Texas" '
        'LIMIT 1000')

    # Set use_legacy_sql to True to use legacy SQL syntax.
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = True

    query_job = client.query(query,
        location='US',
        job_config=job_config)

    results = query_job.result()

    #solar_data = []
    #solarJSON = {}

    for row in results:
        return(("{}: new google.maps.LatLng({}, {}), weight: {}{},").format("{location",row.lat_avg, row.lng_avg, (row.kw_total)/1000,"}"))

    #return heat_data.append(dict(zip(row_headers,result)))
    #for row in query_job:
    #    heat_dict['lat_avg'] = row.lat_avg
    #    heat_dict['lng_avg'] = row.lng_avg
    #return jsonify(query_job)

@app.route('/income_data/<zipcode>')
def income_data(zipcode):

    query = (
        'SELECT * '
        'FROM [solar-project-204922:solarData.median_income_tx] '
        'WHERE Zip_Code = {} '
        'LIMIT 1000').format(zipcode)

    # Set use_legacy_sql to True to use legacy SQL syntax.
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = True

    query_job = client.query(query,
        location='US',
        job_config=job_config)

    incomeJSON = {}
    for row in query_job:

        incomeJSON['Zip_Code'] = row.Zip_Code
        incomeJSON['Latitude'] = row.Latitude
        incomeJSON['Longitude'] = row.Longitude
        incomeJSON['City'] = row.City
        incomeJSON['Population'] = row.Population
        incomeJSON['Avg__Income_H_hold'] = row.Avg__Income_H_hold
        incomeJSON['NatRank'] = row.NatRank

    return jsonify(incomeJSON)


@app.route('/solar_data/<zipcode>')
def solar_data(zipcode):

    query = (
        'SELECT * '
        'FROM [bigquery-public-data:sunroof_solar.solar_potential_by_postal_code] '
        'WHERE region_name = "{}" '
        'LIMIT 1000').format(zipcode)

    # Set use_legacy_sql to True to use legacy SQL syntax.
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = True

    query_job = client.query(query,
        location='US',
        job_config=job_config)

    zipJSON = {}

    for row in query_job:
        #print(row)
        zipJSON['region_name'] = row.region_name
        zipJSON['count_qualified'] = row.count_qualified
        zipJSON['existing_installs_count'] = row.existing_installs_count
        zipJSON['yearly_sunlight_kwh_total'] = row.yearly_sunlight_kwh_total
        zipJSON['lat_avg'] = row.lat_avg
        zipJSON['lng_avg'] = row.lng_avg


    return (jsonify(zipJSON))

@app.route('/history')
def history():
    return jsonify(history)




if __name__ == "__main__":
    app.run(debug=True)
