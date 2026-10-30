using System.Security.Cryptography;

const string KeyName = "MilitaryPMS-TPM-Device-Key";

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://127.0.0.1:8765");

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("ReactApp");

app.MapGet("/", () => Results.Ok(new
{
    service = "Military PMS TPM Helper",
    status = "running"
}));

app.MapGet("/tpm/status", () =>
{
    try
    {
        using var key = OpenOrCreateKey();
        using var rsa = new RSACng(key);

        byte[] publicKey = rsa.ExportSubjectPublicKeyInfo();

        string deviceId = Convert.ToHexString(
            SHA256.HashData(publicKey)
        );

        return Results.Ok(new
        {
            registered = true,
            deviceId,
            keyName = KeyName,
            provider = key.Provider.Provider,
            algorithm = "RSA",
            keySize = rsa.KeySize,
            privateKeyExportable =
                key.ExportPolicy != CngExportPolicies.None
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/tpm/register", () =>
{
    try
    {
        using var key = OpenOrCreateKey();
        using var rsa = new RSACng(key);

        byte[] publicKey = rsa.ExportSubjectPublicKeyInfo();

        string deviceId = Convert.ToHexString(
            SHA256.HashData(publicKey)
        );

        return Results.Ok(new
        {
            success = true,
            deviceId,
            publicKey = Convert.ToBase64String(publicKey),
            keyName = KeyName,
            provider = key.Provider.Provider,
            algorithm = "RSA",
            keySize = rsa.KeySize,
            privateKeyExportable =
                key.ExportPolicy != CngExportPolicies.None
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/tpm/sign", (SignRequest request) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(request.Challenge))
        {
            return Results.BadRequest(new
            {
                error = "Challenge is required."
            });
        }

        byte[] challenge;

        try
        {
            challenge = Convert.FromBase64String(request.Challenge);
        }
        catch (FormatException)
        {
            return Results.BadRequest(new
            {
                error = "Challenge must be valid Base64."
            });
        }

        using var key = OpenOrCreateKey();
        using var rsa = new RSACng(key);

        byte[] signature = rsa.SignData(
            challenge,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1
        );

        return Results.Ok(new
        {
            success = true,
            deviceId = GetDeviceId(key),
            algorithm = "RS256",
            signature = Convert.ToBase64String(signature)
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run();

static CngKey OpenOrCreateKey()
{
    try
    {
        return CngKey.Open(
            KeyName,
            CngProvider.MicrosoftPlatformCryptoProvider
        );
    }
    catch (CryptographicException)
    {
        return CngKey.Create(
            CngAlgorithm.Rsa,
            KeyName,
            new CngKeyCreationParameters
            {
                Provider =
                    CngProvider.MicrosoftPlatformCryptoProvider,
                ExportPolicy = CngExportPolicies.None,
                KeyCreationOptions =
                    CngKeyCreationOptions.None
            }
        );
    }
}

static string GetDeviceId(CngKey key)
{
    using var rsa = new RSACng(key);

    byte[] publicKey = rsa.ExportSubjectPublicKeyInfo();

    return Convert.ToHexString(
        SHA256.HashData(publicKey)
    );
}

record SignRequest(string Challenge);