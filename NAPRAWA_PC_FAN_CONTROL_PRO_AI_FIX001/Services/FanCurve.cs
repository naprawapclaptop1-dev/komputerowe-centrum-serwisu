namespace NaprawaPCFanControlPro.Services;

public static class FanCurve
{
    public static float GetTargetPercent(string profile, float temperatureC)
    {
        if (!float.IsFinite(temperatureC)) return 0;
        return profile switch
        {
            "Cichy" => Step(temperatureC, 40, 25, 55, 35, 65, 45, 75, 60, 85, 80, 100),
            "Wydajny" => Step(temperatureC, 30, 45, 45, 60, 60, 75, 75, 90, 100),
            _ => Step(temperatureC, 35, 30, 50, 40, 65, 60, 75, 75, 85, 90, 100)
        };
    }

    private static float Step(float t, params float[] points)
    {
        for (var i = 0; i < points.Length - 1; i += 2)
            if (t <= points[i]) return points[i + 1];
        return points[^1];
    }
}
