# Generate Area Code Csv

http://opengeodb.giswiki.org/wiki/OpenGeoDB

```
SELECT cn.text_val AS city,
       ac.text_val AS area_code,
       coords.lon AS lng,
       coords.lat AS lat,
       max(numbers.int_val) AS count
INTO OUTFILE 'area_codes.csv'
FIELDS TERMINATED BY ';'
LINES TERMINATED BY '\n'
FROM geodb_textdata ac
INNER JOIN geodb_textdata cn ON ac.loc_id = cn.loc_id
INNER JOIN geodb_coordinates coords ON cn.loc_id = coords.loc_id
INNER JOIN geodb_intdata numbers on coords.loc_id = numbers.loc_id
WHERE ac.text_type='500400000'
  AND cn.text_type='500100000'
  AND numbers.int_type='600700000'
GROUP BY area_code
ORDER BY area_code;
```